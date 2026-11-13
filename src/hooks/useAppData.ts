import { useState, useCallback, useRef } from 'react';
import { UserAccount, Gig, Project, Proposal, Order, Dispute, Refund, Payout, Category, Review, SupportTicket, AuditLog, Message, WorkstreamOffer } from '../types';
import { getAuthToken, setAuthToken, requestDemoSession } from '../utils/authToken';
import { getDeviceId } from '../utils/deviceId';


export interface UseAppDataOptions {
  waitForSession?: () => Promise<boolean>;
  activePath?: string;
}

function isLegalOnlyPath(path?: string): boolean {
  if (!path) return false;
  const clean = path.split('?')[0].replace(/\/+$/, '').toLowerCase();
  return clean === '/terms' || clean === '/privacy' || clean === '/refund-policy';
}

function needsCategoriesForPath(path?: string): boolean {
  if (!path) return false;
  const clean = path.split('?')[0].replace(/\/+$/, '').toLowerCase();
  return clean === '/freelance-activity' || clean === '/freelancer' || clean.startsWith('/admin');
}

export const useAppData = (initialData?: any, options?: UseAppDataOptions) => {
  const [users, setUsers] = useState<UserAccount[]>(initialData?.users ?? []);
  const [gigs, setGigs] = useState<Gig[]>(initialData?.gigs ?? []);
  const [projects, setProjects] = useState<Project[]>(initialData?.projects ?? []);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [offers, setOffers] = useState<WorkstreamOffer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialData?.categories ?? []);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userEmails, setUserEmails] = useState<string[]>([]);
  
  const [platformFee, setPlatformFee] = useState<number>(20);
  const [clientServiceFee, setClientServiceFee] = useState<number>(1);
  const [smallOrderFeeThreshold, setSmallOrderFeeThreshold] = useState<number>(200);
  const [smallOrderFeeAmount, setSmallOrderFeeAmount] = useState<number>(1);
  const [escrowProtectionDays, setEscrowProtectionDays] = useState<number>(14);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstMountFetchRef = useRef(true);
  const fetchSeqRef = useRef(0);
  const inFlightFetchRef = useRef<{ key: string; promise: Promise<void> } | null>(null);
  const activePathRef = useRef<string | undefined>(options?.activePath);
  activePathRef.current = options?.activePath;
  const waitForSessionRef = useRef<(() => Promise<boolean>) | undefined>(options?.waitForSession);
  waitForSessionRef.current = options?.waitForSession;
  const initialHydratedFlagsRef = useRef({
    hasUsers: Array.isArray(initialData?.users) && initialData.users.length > 0,
    hasGigs: Array.isArray(initialData?.gigs) && initialData.gigs.length > 0,
    hasProjects: Array.isArray(initialData?.projects) && initialData.projects.length > 0,
    hasCategories: Array.isArray(initialData?.categories) && initialData.categories.length > 0,
    hasReviews: false,
    hasFees: false
  });

  const fetchUserEmails = async (userId: string) => {
    try {
      const res = await fetch(`/api/user-emails/${userId}`);
      if (res.ok) setUserEmails(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const safeJson = async (res: Response | null, fallback: any = []) => {
    if (!res || !res.ok) return fallback;
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return fallback;
    try {
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const decodeJwt = (tok: string | null) => {
    if (!tok) return { tokenUserId: null as string | null, tokenUserRole: null as string | null };
    try {
      const parts = tok.split('.');
      if (parts[1] && typeof atob === 'function') {
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) {
          b64 += '=';
        }
        const payload = JSON.parse(atob(b64));
        return {
          tokenUserId: payload?.id ? String(payload.id) : null,
          tokenUserRole: payload?.role ? String(payload.role) : null
        };
      }
    } catch {}
    return { tokenUserId: null as string | null, tokenUserRole: null as string | null };
  };

  const fetchData = useCallback(async (currentUserId?: string) => {
    const activePath = activePathRef.current || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const legalRoute = isLegalOnlyPath(activePath);
    const initialToken = getAuthToken();
    const dedupeKey = `${currentUserId || ''}|${initialToken || ''}|${legalRoute ? 'legal' : 'app'}|${needsCategoriesForPath(activePath) ? 'cat' : 'nocat'}`;

    if (inFlightFetchRef.current && inFlightFetchRef.current.key === dedupeKey) {
      return inFlightFetchRef.current.promise;
    }

    const seq = ++fetchSeqRef.current;
    const isInitialMountPass = isFirstMountFetchRef.current;
    isFirstMountFetchRef.current = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let token = getAuthToken();
        let cachedUserId: string | null = currentUserId || null;
        let cachedUserRole: string | null = null;
        try {
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('current_user');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.id && !cachedUserId) cachedUserId = parsed.id;
              if (parsed?.role) cachedUserRole = parsed.role;
            }
          }
        } catch {}

        let { tokenUserId, tokenUserRole } = decodeJwt(token);
        const buildReqOpt = (tok: string | null) => ({
          headers: {
            'x-device-id': getDeviceId(),
            ...(tok ? { 'Authorization': `Bearer ${tok}` } : {})
          }
        });

        // Verify admin/support strictly from token claims (not unverified localStorage role)
        let isTokenAdmin = Boolean(tokenUserRole && ['admin', 'super_admin', 'support'].includes(tokenUserRole));
        const isCachedAdmin = Boolean(cachedUserRole && ['admin', 'super_admin', 'support'].includes(cachedUserRole));

        const skipPublicMarketplace = legalRoute && isInitialMountPass;
        const skipUsersOnMount = skipPublicMarketplace || (isInitialMountPass && !isTokenAdmin && initialHydratedFlagsRef.current.hasUsers);
        const skipGigsOnMount = skipPublicMarketplace || (isInitialMountPass && initialHydratedFlagsRef.current.hasGigs);
        const skipProjectsOnMount = skipPublicMarketplace || (isInitialMountPass && initialHydratedFlagsRef.current.hasProjects);
        const skipCategoriesOnMount =
          skipPublicMarketplace ||
          initialHydratedFlagsRef.current.hasCategories ||
          !needsCategoriesForPath(activePath);
        const skipReviewsOnMount = skipPublicMarketplace || (!isInitialMountPass && initialHydratedFlagsRef.current.hasReviews);
        const skipFeesOnMount = skipPublicMarketplace || (!isInitialMountPass && initialHydratedFlagsRef.current.hasFees);

        const baseReqOpt = buildReqOpt(token);

        // Start independent public requests immediately without waiting for auth/session resolution
        const uPromise = skipUsersOnMount ? Promise.resolve(null) : fetch('/api/users', baseReqOpt);
        const gPromise = skipGigsOnMount ? Promise.resolve(null) : fetch('/api/gigs', baseReqOpt);
        const pPromise = skipProjectsOnMount ? Promise.resolve(null) : fetch('/api/projects', baseReqOpt);
        const cPromise = skipCategoriesOnMount ? Promise.resolve(null) : fetch('/api/categories', baseReqOpt);
        const revPromise = skipReviewsOnMount ? Promise.resolve(null) : fetch('/api/reviews', baseReqOpt);
        const feeConfigPromise = skipFeesOnMount ? Promise.resolve(null) : fetch('/api/fees/config', baseReqOpt);

        // Concurrently resolve session token if needed, then fire all auth-gated + admin-gated endpoints in parallel
        const authAndAdminPromise = (async () => {
          if (!token && waitForSessionRef.current) {
            await waitForSessionRef.current().catch(() => false);
            token = getAuthToken();
            ({ tokenUserId, tokenUserRole } = decodeJwt(token));
            isTokenAdmin = Boolean(tokenUserRole && ['admin', 'super_admin', 'support'].includes(tokenUserRole));
          }

          if ((!token || (!isTokenAdmin && cachedUserId && tokenUserId !== cachedUserId)) && cachedUserId && !isCachedAdmin) {
            const recovered = await requestDemoSession(cachedUserId);
            if (recovered?.token) {
              token = recovered.token;
              setAuthToken(token);
              ({ tokenUserId, tokenUserRole } = decodeJwt(token));
              isTokenAdmin = Boolean(tokenUserRole && ['admin', 'super_admin', 'support'].includes(tokenUserRole));
            }
          }

          const authReqOpt = buildReqOpt(token);
          if (!token) {
            return {
              prRes: null, offRes: null, oRes: null,
              dRes: null, rRes: null, payRes: null, sRes: null, aRes: null, setRes: null,
              isTokenAdmin: false, hasToken: false
            };
          }

          let [prRes, offRes, oRes, dRes, rRes, payRes, sRes, aRes, setRes] = await Promise.all([
            fetch('/api/proposals', authReqOpt),
            fetch('/api/offers', authReqOpt),
            fetch('/api/orders', authReqOpt),
            isTokenAdmin ? fetch('/api/disputes', authReqOpt) : Promise.resolve(null),
            isTokenAdmin ? fetch('/api/refunds', authReqOpt) : Promise.resolve(null),
            isTokenAdmin ? fetch('/api/payouts', authReqOpt) : Promise.resolve(null),
            isTokenAdmin ? fetch('/api/support-tickets', authReqOpt) : Promise.resolve(null),
            isTokenAdmin ? fetch('/api/audit-logs', authReqOpt) : Promise.resolve(null),
            isTokenAdmin ? fetch('/api/admin/settings', authReqOpt) : Promise.resolve(null)
          ]);

          if (oRes && oRes.status === 401 && cachedUserId && !isTokenAdmin && !isCachedAdmin) {
            const recovered = await requestDemoSession(cachedUserId);
            if (recovered?.token) {
              token = recovered.token;
              setAuthToken(token);
              const retryOpt = buildReqOpt(token);
              [prRes, offRes, oRes] = await Promise.all([
                fetch('/api/proposals', retryOpt),
                fetch('/api/offers', retryOpt),
                fetch('/api/orders', retryOpt)
              ]);
            }
          }

          return {
            prRes, offRes, oRes,
            dRes, rRes, payRes, sRes, aRes, setRes,
            isTokenAdmin, hasToken: Boolean(token)
          };
        })();

        const [uRes, gRes, pRes, cRes, revRes, feeConfigRes, authBundle] = await Promise.all([
          uPromise, gPromise, pPromise, cPromise, revPromise, feeConfigPromise, authAndAdminPromise
        ]);

        if (fetchSeqRef.current !== seq) return;

        const [
          usersData,
          gigsData,
          projectsData,
          categoriesData,
          reviewsData,
          feeConfigData,
          proposalsData,
          offersData,
          ords,
          disputesData,
          refundsData,
          payoutsData,
          supportTicketsData,
          auditLogsData,
          settingsData
        ] = await Promise.all([
          safeJson(uRes, null),
          safeJson(gRes, null),
          safeJson(pRes, null),
          safeJson(cRes, null),
          safeJson(revRes, null),
          safeJson(feeConfigRes, null),
          safeJson(authBundle.prRes, null),
          safeJson(authBundle.offRes, null),
          safeJson(authBundle.oRes, null),
          safeJson(authBundle.dRes, null),
          safeJson(authBundle.rRes, null),
          safeJson(authBundle.payRes, null),
          safeJson(authBundle.sRes, null),
          safeJson(authBundle.aRes, null),
          safeJson(authBundle.setRes, null)
        ]);

        if (fetchSeqRef.current !== seq) return;

        if (Array.isArray(usersData)) {
          initialHydratedFlagsRef.current.hasUsers = true;
          setUsers(usersData);
        }
        if (Array.isArray(gigsData)) {
          initialHydratedFlagsRef.current.hasGigs = true;
          setGigs(gigsData);
        }
        if (Array.isArray(projectsData)) {
          initialHydratedFlagsRef.current.hasProjects = true;
          setProjects(projectsData);
        }
        if (Array.isArray(categoriesData)) {
          initialHydratedFlagsRef.current.hasCategories = true;
          setCategories(categoriesData);
        }
        if (Array.isArray(reviewsData)) {
          initialHydratedFlagsRef.current.hasReviews = true;
          setReviews(reviewsData);
        }
        if (Array.isArray(proposalsData)) setProposals(proposalsData);
        if (Array.isArray(offersData)) setOffers(offersData);
        if (Array.isArray(ords)) setOrders(ords);

        if (feeConfigData) {
          initialHydratedFlagsRef.current.hasFees = true;
          if (feeConfigData.commissionPercent !== undefined) setPlatformFee(feeConfigData.commissionPercent);
          if (feeConfigData.clientServiceFee !== undefined) setClientServiceFee(feeConfigData.clientServiceFee);
          else if (feeConfigData.buyerFeePercent !== undefined) setClientServiceFee(feeConfigData.buyerFeePercent);
          if (feeConfigData.smallOrderFeeThreshold !== undefined) setSmallOrderFeeThreshold(feeConfigData.smallOrderFeeThreshold);
          if (feeConfigData.smallOrderFeeAmount !== undefined) setSmallOrderFeeAmount(feeConfigData.smallOrderFeeAmount);
          else if (feeConfigData.smallOrderFee !== undefined) setSmallOrderFeeAmount(feeConfigData.smallOrderFee);
        }

        if (authBundle.hasToken && authBundle.isTokenAdmin) {
          if (Array.isArray(disputesData)) setDisputes(disputesData);
          if (Array.isArray(refundsData)) setRefunds(refundsData);
          if (Array.isArray(payoutsData)) setPayouts(payoutsData);
          if (Array.isArray(supportTicketsData)) setSupportTickets(supportTicketsData);
          if (Array.isArray(auditLogsData)) setAuditLogs(auditLogsData);

          if (settingsData) {
            if (settingsData.freelancerCommissionRate !== undefined) setPlatformFee(settingsData.freelancerCommissionRate);
            if (settingsData.clientServiceFee !== undefined) setClientServiceFee(settingsData.clientServiceFee);
            else if (settingsData.buyerProcessingFeeRate !== undefined) setClientServiceFee(settingsData.buyerProcessingFeeRate);
            if (settingsData.smallOrderFeeThreshold !== undefined) setSmallOrderFeeThreshold(settingsData.smallOrderFeeThreshold);
            if (settingsData.smallOrderFeeAmount !== undefined) setSmallOrderFeeAmount(settingsData.smallOrderFeeAmount);
            else if (settingsData.smallOrderFee !== undefined) setSmallOrderFeeAmount(settingsData.smallOrderFee);
            if (settingsData.escrowHoldDays !== undefined) setEscrowProtectionDays(settingsData.escrowHoldDays);
          }
        } else {
          // Clear protected admin data when caller is unauthenticated or non-admin
          setDisputes(prev => (prev.length > 0 ? [] : prev));
          setRefunds(prev => (prev.length > 0 ? [] : prev));
          setPayouts(prev => (prev.length > 0 ? [] : prev));
          setSupportTickets(prev => (prev.length > 0 ? [] : prev));
          setAuditLogs(prev => (prev.length > 0 ? [] : prev));
        }

        if (!authBundle.hasToken) {
          setProposals(prev => (prev.length > 0 ? [] : prev));
          setOffers(prev => (prev.length > 0 ? [] : prev));
          setOrders(prev => (prev.length > 0 ? [] : prev));
        }
      } catch (e) {
        if (fetchSeqRef.current === seq) {
          setError('Failed to fetch data');
        }
        console.error(e);
      } finally {
        if (fetchSeqRef.current === seq) {
          setIsLoading(false);
        }
      }
    };

    const promise = run().finally(() => {
      if (inFlightFetchRef.current?.promise === promise) {
        inFlightFetchRef.current = null;
      }
    });
    inFlightFetchRef.current = { key: dedupeKey, promise };
    return promise;
  }, []);

  return {
    users, setUsers,
    gigs, setGigs,
    projects, setProjects,
    proposals, setProposals,
    offers, setOffers,
    orders, setOrders,
    reviews, setReviews,
    messages, setMessages,
    disputes, setDisputes,
    refunds, setRefunds,
    payouts, setPayouts,
    categories, setCategories,
    supportTickets, setSupportTickets,
    auditLogs, setAuditLogs,
    userEmails, setUserEmails, fetchUserEmails,
    platformFee, setPlatformFee,
    clientServiceFee, setClientServiceFee,
    smallOrderFeeThreshold, setSmallOrderFeeThreshold,
    smallOrderFeeAmount, setSmallOrderFeeAmount,
    escrowProtectionDays, setEscrowProtectionDays,
    isLoading,
    error,
    refresh: fetchData
  };
};
