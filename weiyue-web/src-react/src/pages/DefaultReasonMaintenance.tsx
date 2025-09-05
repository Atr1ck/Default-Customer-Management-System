import React, { useState, useEffect } from 'react';
import { Table, Switch, InputNumber, Tabs } from 'antd';
import type { DefaultReason } from '../types';
import { ReasonAPI, RecoveryReasonAPI } from '../services/api';

const DefaultReasonMaintenance: React.FC = () => {
  const [data, setData] = useState<DefaultReason[]>([]);
  const [recoveryData, setRecoveryData] = useState<DefaultReason[]>([]);
  

  useEffect(() => {
    ReasonAPI.list().then((list) => setData(list as DefaultReason[])).catch(console.error);
    RecoveryReasonAPI.list().then((list) => setRecoveryData(list as DefaultReason[])).catch(console.error);
  }, []);

  // 只读模式：不提供新增、编辑、删除

  const handleOrderChange = (id: string, newOrder: number) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, order: newOrder } : item
    ));
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number, record: DefaultReason) => (
        <InputNumber
          min={1}
          value={order}
          onChange={(value) => handleOrderChange(record.id, value || 1)}
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
          onChange={async (checked) => {
            const prev = data;
            setData(prev => prev.map(item => item.id === record.id ? { ...item, isEnabled: checked } : item));
            try {
              await ReasonAPI.setEnable(record.id, checked);
            } catch {
              // 回滚
              setData(prev);
            }
          }}
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

  const recoveryColumns = [
    {
      title: '序号',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number, record: DefaultReason) => (
        <InputNumber
          min={1}
          value={order}
          onChange={(value) => setRecoveryData(prev => prev.map(item => item.id === record.id ? { ...item, order: value || 1 } : item))}
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
          onChange={async (checked) => {
            const prev = recoveryData;
            setRecoveryData(prev => prev.map(item => item.id === record.id ? { ...item, isEnabled: checked } : item));
            try {
              await RecoveryReasonAPI.setEnable(record.id, checked);
            } catch {
              setRecoveryData(prev);
            }
          }}
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>原因维护</h2>
      </div>
      <Tabs
        defaultActiveKey="default"
        items={[
          {
            key: 'default',
            label: '违约原因',
            children: (
              <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                }}
                scroll={{ x: 800 }}
              />
            )
          },
          {
            key: 'recovery',
            label: '重生原因',
            children: (
              <Table
                columns={recoveryColumns}
                dataSource={recoveryData}
                rowKey="id"
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                }}
                scroll={{ x: 800 }}
              />
            )
          }
        ]}
      />
    </div>
  );
};

export default DefaultReasonMaintenance;
