# 违约客户管理系统 - React前端

## 项目简介

这是一个基于React + TypeScript + Ant Design的违约客户管理系统前端项目，提供完整的违约客户管理功能。

## 技术栈

- **React 19** - 前端框架
- **TypeScript** - 类型安全
- **Ant Design** - UI组件库
- **React Router** - 路由管理
- **ECharts** - 图表展示
- **Vite** - 构建工具

## 功能模块

### 1. 违约原因维护
- 违约原因列表展示
- 新增、编辑、删除违约原因
- 启用/禁用状态管理
- 序号排序功能

### 2. 违约认定申请
- 客户选择（带搜索）
- 违约原因多选
- 严重性评估
- 附件上传
- 表单验证

### 3. 违约认定审核
- 申请列表查询
- 审核状态管理
- 审核意见录入
- 批量审核支持

### 4. 违约信息查询
- 多条件高级查询
- 分页展示
- 详情查看
- Excel导出功能

### 5. 违约重生申请
- 违约客户列表
- 重生原因选择
- 申请状态跟踪

### 6. 违约重生审核
- 重生申请审核
- 审核流程管理
- 状态更新

### 7. 违约统计
- 行业分布统计
- 区域分布统计
- 趋势分析图表
- 数据导出

## 项目结构

```
src/
├── components/          # 公共组件
│   └── Layout.tsx      # 主布局组件
├── pages/              # 页面组件
│   ├── DefaultReasonMaintenance.tsx    # 违约原因维护
│   ├── DefaultApplication.tsx          # 违约认定申请
│   ├── DefaultReview.tsx               # 违约认定审核
│   ├── DefaultQuery.tsx                # 违约信息查询
│   ├── RebirthApplication.tsx          # 违约重生申请
│   ├── RebirthReview.tsx               # 违约重生审核
│   └── Statistics.tsx                  # 违约统计
├── services/            # 服务层
│   └── mockData.ts     # 模拟数据
├── types/               # 类型定义
│   └── index.ts        # 接口类型
├── utils/               # 工具函数
├── hooks/               # 自定义Hooks
├── App.tsx             # 主应用组件
└── main.tsx            # 应用入口
```

## 安装和运行

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 开发说明

### 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 组件使用函数式组件 + Hooks
- 使用Ant Design组件库保持UI一致性

### 状态管理
- 使用React Hooks管理组件状态
- 复杂状态考虑使用useReducer
- 全局状态可扩展使用Context API

### 数据流
- 页面组件负责UI渲染和用户交互
- 服务层负责数据获取和API调用
- 类型定义确保数据一致性

### 样式管理
- 使用Ant Design主题系统
- 自定义样式通过CSS文件
- 响应式设计支持移动端

## 部署说明

### 构建
```bash
npm run build
```

### 部署
将`dist`目录下的文件部署到Web服务器即可。

## 注意事项

1. 当前使用模拟数据，实际使用时需要替换为真实API
2. 文件上传功能需要配置后端接口
3. 导出功能需要后端支持
4. 权限控制需要根据实际业务需求实现

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完成所有基础功能模块
- 集成Ant Design组件库
- 实现响应式布局
