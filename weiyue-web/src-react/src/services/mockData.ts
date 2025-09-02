import type { DefaultReason, Customer, DefaultApplication, DefaultReview, RebirthApplication, RebirthReview } from '../types';

// 模拟违约原因数据
export const mockDefaultReasons: DefaultReason[] = [
  {
    id: '1',
    content: '经营不善导致资金链断裂',
    isEnabled: true,
    order: 1,
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00'
  },
  {
    id: '2',
    content: '行业政策变化影响经营',
    isEnabled: true,
    order: 2,
    createTime: '2024-01-02 10:00:00',
    updateTime: '2024-01-02 10:00:00'
  },
  {
    id: '3',
    content: '市场竞争激烈导致亏损',
    isEnabled: false,
    order: 3,
    createTime: '2024-01-03 10:00:00',
    updateTime: '2024-01-03 10:00:00'
  },
  {
    id: '4',
    content: '管理团队变动影响决策',
    isEnabled: true,
    order: 4,
    createTime: '2024-01-04 10:00:00',
    updateTime: '2024-01-04 10:00:00'
  }
];

// 模拟客户数据
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: '北京科技有限公司',
    externalLevel: 'AA',
    isDefaulted: false,
    industry: '科技',
    region: '北京'
  },
  {
    id: '2',
    name: '上海贸易有限公司',
    externalLevel: 'BBB',
    isDefaulted: true,
    industry: '贸易',
    region: '上海'
  },
  {
    id: '3',
    name: '深圳制造企业',
    externalLevel: 'BB',
    isDefaulted: false,
    industry: '制造',
    region: '深圳'
  }
];

// 模拟违约认定申请数据
export const mockDefaultApplications: DefaultApplication[] = [
  {
    id: '1',
    customerId: '2',
    customerName: '上海贸易有限公司',
    externalLevel: 'BBB',
    reasons: ['1', '2'],
    severity: 'high',
    remark: '企业经营状况持续恶化',
    attachments: ['attachment1.pdf'],
    status: 'pending',
    createTime: '2024-01-15 10:00:00',
    updateTime: '2024-01-15 10:00:00'
  }
];

// 模拟违约认定审核数据
export const mockDefaultReviews: DefaultReview[] = [
  {
    id: '1',
    applicationId: '1',
    customerName: '上海贸易有限公司',
    reasons: ['经营不善导致资金链断裂', '行业政策变化影响经营'],
    severity: 'high',
    applyTime: '2024-01-15 10:00:00',
    status: 'pending',
    reviewer: '',
    reviewTime: '',
    reviewRemark: ''
  }
];

// 模拟违约重生申请数据
export const mockRebirthApplications: RebirthApplication[] = [
  {
    id: '1',
    customerId: '2',
    customerName: '上海贸易有限公司',
    originalReason: '经营不善导致资金链断裂',
    severity: 'high',
    rebirthReason: '企业重组完成，经营状况改善',
    status: 'pending',
    createTime: '2024-02-01 10:00:00',
    updateTime: '2024-02-01 10:00:00'
  }
];

// 模拟违约重生审核数据
export const mockRebirthReviews: RebirthReview[] = [
  {
    id: '1',
    applicationId: '1',
    customerName: '上海贸易有限公司',
    originalReason: '经营不善导致资金链断裂',
    severity: 'high',
    rebirthReason: '企业重组完成，经营状况改善',
    status: 'pending',
    applyTime: '2024-02-01 10:00:00',
    reviewer: '',
    reviewTime: '',
    reviewRemark: ''
  }
];

// 重生原因选项
export const rebirthReasons = [
  '企业重组完成，经营状况改善',
  '行业政策调整，经营环境好转',
  '管理团队优化，决策能力提升',
  '市场环境改善，业务恢复增长',
  '资金问题解决，财务状况稳定',
  '其他原因'
];

// 严重性选项
export const severityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
];

// 审核状态选项
export const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
];
