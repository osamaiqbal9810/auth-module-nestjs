import { 
    BASIC_PLAN_FILES_SIZE_LIMIT, 
    PREMIUM_PLAN_FILES_SIZE_LIMIT, 
    STANDARD_PLAN_FILES_SIZE_LIMIT 
} 
from "src/Files/Global.constnats";

export enum SubscriptionPlan {
    Basic, // 100MB
    Standard, // 1 GB
    Premium // 100 GB
}

interface PlanProperties {
    quota: number;
}

export const planProperties: Record<string, PlanProperties> = {
     [SubscriptionPlan.Basic]: { quota: BASIC_PLAN_FILES_SIZE_LIMIT},
     [SubscriptionPlan.Standard]: { quota: STANDARD_PLAN_FILES_SIZE_LIMIT },
     [SubscriptionPlan.Premium]: { quota: PREMIUM_PLAN_FILES_SIZE_LIMIT }
};