// 违约原因类型
export interface DefaultReason {
  id: string;
  content: string;
  isEnabled: boolean;
  order: number;
  createTime: string;
  updateTime: string;
}

// 客户类型
export interface Customer {
  id: string;
  name: string;
  externalLevel: string;
  isDefaulted: boolean;
  industry: string;
  region: string;
}

// 违约认定申请类型
export interface DefaultApplication {
  id: string;
  customerId: string;
  customerName: string;
  externalLevel: string;
  reasons: string[];
  severity: 'high' | 'medium' | 'low';
  remark: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'rejected';
  createTime: string;
  updateTime: string;
}

// 违约认定审核类型
export interface DefaultReview {
  id: string;
  applicationId: string;
  customerName: string;
  reasons: string[];
  severity: 'high' | 'medium' | 'low';
  applyTime: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer: string;
  reviewTime: string;
  reviewRemark: string;
}

// 违约重生申请类型
export interface RebirthApplication {
  id: string;
  customerId: string;
  customerName: string;
  originalReason: string;
  severity: 'high' | 'medium' | 'low';
  rebirthReason: string;
  status: 'pending' | 'approved' | 'rejected';
  createTime: string;
  updateTime: string;
}

// 违约重生审核类型
export interface RebirthReview {
  id: string;
  applicationId: string;
  customerName: string;
  originalReason: string;
  severity: 'high' | 'medium' | 'low';
  rebirthReason: string;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
  reviewer: string;
  reviewTime: string;
  reviewRemark: string;
}

// 统计数据类型
export interface StatisticsData {
  industry?: {
    name: string;
    count: number;
    percentage: number;
  }[];
  region?: {
    name: string;
    count: number;
    percentage: number;
  }[];
  trend?: {
    date: string;
    count: number;
  }[];
}

// 查询参数类型
export interface QueryParams {
  customerName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  reviewer?: string;
  page?: number;
  pageSize?: number;
}
