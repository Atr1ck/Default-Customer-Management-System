import React, { useState, useEffect } from 'react';
import { Table, Switch, InputNumber, Tabs, message } from 'antd';
import type { DefaultReason } from '../types';
import { ReasonAPI, RecoveryReasonAPI } from '../services/api';

const ReasonMaintenance: React.FC = () => {
  const [defaultReasons, setDefaultReasons] = useState<DefaultReason[]>([]);
  const [recoveryReasons, setRecoveryReasons] = useState<DefaultReason[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDefaultReasons();
    loadRecoveryReasons();
  }, []);

  const loadDefaultReasons = async () => {
    try {
      setLoading(true);
      const list = await ReasonAPI.list();
      setDefaultReasons(list as DefaultReason[]);
    } catch (error) {
      console.error('加载违约原因失败:', error);
      message.error('加载违约原因失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRecoveryReasons = async () => {
    try {
      setLoading(true);
      const list = await RecoveryReasonAPI.list();
      setRecoveryReasons(list as DefaultReason[]);
    } catch (error) {
      console.error('加载重生原因失败:', error);
      message.error('加载重生原因失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultOrderChange = (id: string, newOrder: number) => {
    setDefaultReasons(prev => prev.map(item => 
      item.id === id ? { ...item, order: newOrder } : item
    ));
  };

  const handleRecoveryOrderChange = (id: string, newOrder: number) => {
    setRecoveryReasons(prev => prev.map(item => 
      item.id === id ? { ...item, order: newOrder } : item
    ));
  };

  const handleDefaultEnableChange = async (record: DefaultReason, checked: boolean) => {
    const prev = defaultReasons;
    setDefaultReasons(prev => prev.map(item => 
      item.id === record.id ? { ...item, isEnabled: checked } : item
    ));
    
    try {
      await ReasonAPI.setEnable(record.id, checked);
      message.success('更新成功');
    } catch (error) {
      // 回滚
      setDefaultReasons(prev);
      message.error('更新失败');
    }
  };

  const handleRecoveryEnableChange = async (record: DefaultReason, checked: boolean) => {
    const prev = recoveryReasons;
    setRecoveryReasons(prev => prev.map(item => 
      item.id === record.id ? { ...item, isEnabled: checked } : item
    ));
    
    try {
      await RecoveryReasonAPI.setEnable(record.id, checked);
      message.success('更新成功');
    } catch (error) {
      // 回滚
      setRecoveryReasons(prev);
      message.error('更新失败');
    }
  };

  const createColumns = (
    orderChangeHandler: (id: string, newOrder: number) => void,
    enableChangeHandler: (record: DefaultReason, checked: boolean) => void
  ) => [
    {
      title: '序号',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number, record: DefaultReason) => (
        <InputNumber
          min={1}
          value={order}
          onChange={(value) => orderChangeHandler(record.id, value || 1)}
          style={{ width: 60 }}
        />
      ),
    },
    {
      title: '原因内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '是否启用',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 100,
      render: (isEnabled: boolean, record: DefaultReason) => (
        <Switch
          checked={isEnabled}
          onChange={(checked) => enableChangeHandler(record, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 150,
    },
  ];

  const defaultColumns = createColumns(handleDefaultOrderChange, handleDefaultEnableChange);
  const recoveryColumns = createColumns(handleRecoveryOrderChange, handleRecoveryEnableChange);

  const tabItems = [
    {
      key: 'default',
      label: '违约原因维护',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h3>违约原因列表</h3>
            <div style={{ color: '#888' }}>仅展示后端启用的违约原因</div>
          </div>
          <Table
            columns={defaultColumns}
            dataSource={defaultReasons}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 800 }}
          />
        </div>
      ),
    },
    {
      key: 'recovery',
      label: '重生原因维护',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h3>重生原因列表</h3>
            <div style={{ color: '#888' }}>仅展示后端启用的重生原因</div>
          </div>
          <Table
            columns={recoveryColumns}
            dataSource={recoveryReasons}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 800 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>原因维护</h2>
        <div style={{ color: '#888' }}>管理违约原因和重生原因</div>
      </div>

      <Tabs
        defaultActiveKey="default"
        items={tabItems}
        size="large"
        tabBarStyle={{ marginBottom: 16 }}
      />
    </div>
  );
};

export default ReasonMaintenance;
