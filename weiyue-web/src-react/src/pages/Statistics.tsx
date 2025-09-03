import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Select,
  Row,
  Col,
  Table,
  Space,
  Button,
  Collapse
} from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { StatisticsData } from '../types';
import { StatisticsAPI } from '../services/api';

const { Option } = Select;
const { Panel } = Collapse;

const Statistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('industry');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [loading, setLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState<StatisticsData>({});

  useEffect(() => {
    loadStatisticsData();
  }, [selectedYear, activeTab]);

  const loadStatisticsData = async () => {
    try {
      setLoading(true);
      const data = await StatisticsAPI.get();
      setStatisticsData(data as StatisticsData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPieChartOption = (data: any[], title: string) => ({
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '违约数量',
        type: 'pie',
        radius: '50%',
        data: data.map(item => ({
          value: item.count,
          name: item.name
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  });

  const getLineChartOption = (data: any[]) => ({
    title: {
      text: '违约趋势分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      name: '违约数量'
    },
    series: [
      {
        name: '违约数量',
        type: 'line',
        data: data.map(item => item.count),
        smooth: true,
        lineStyle: {
          color: '#1890ff',
          width: 3
        },
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  });

  const getBarChartOption = (data: any[], title: string) => ({
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '违约数量'
    },
    series: [
      {
        name: '违约数量',
        type: 'bar',
        data: data.map(item => item.count),
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  });

  const handleExport = (type: string) => {
    // 模拟导出功能
    console.log(`导出${type}统计数据`);
  };

  const tabItems = [
    {
      key: 'industry',
      label: '行业统计',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <ReactECharts
                option={getPieChartOption(statisticsData.industry || [], '行业违约分布')}
                style={{ height: '400px' }}
                loading={loading}
              />
            </Col>
            <Col span={12}>
              <ReactECharts
                option={getBarChartOption(statisticsData.industry || [], '行业违约数量对比')}
                style={{ height: '400px' }}
                loading={loading}
              />
            </Col>
          </Row>
          
          <Collapse>
            <Panel header="行业统计数据表格" key="1">
              <Table
                dataSource={statisticsData.industry || []}
                columns={[
                  { title: '行业', dataIndex: 'name', key: 'name' },
                  { title: '违约数量', dataIndex: 'count', key: 'count' },
                  { title: '占比(%)', dataIndex: 'percentage', key: 'percentage' }
                ]}
                rowKey="name"
                pagination={false}
                size="small"
              />
            </Panel>
          </Collapse>
        </div>
      )
    },
    {
      key: 'region',
      label: '区域统计',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <ReactECharts
                option={getPieChartOption(statisticsData.region || [], '区域违约分布')}
                style={{ height: '400px' }}
                loading={loading}
              />
            </Col>
            <Col span={12}>
              <ReactECharts
                option={getBarChartOption(statisticsData.region || [], '区域违约数量对比')}
                style={{ height: '400px' }}
                loading={loading}
              />
            </Col>
          </Row>
          
          <Collapse>
            <Panel header="区域统计数据表格" key="1">
              <Table
                dataSource={statisticsData.region || []}
                columns={[
                  { title: '区域', dataIndex: 'name', key: 'name' },
                  { title: '违约数量', dataIndex: 'count', key: 'count' },
                  { title: '占比(%)', dataIndex: 'percentage', key: 'percentage' }
                ]}
                rowKey="name"
                pagination={false}
                size="small"
              />
            </Panel>
          </Collapse>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>违约统计</h2>
        <p style={{ color: '#666' }}>分析违约客户的行业分布、区域分布和趋势变化</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: 8 }}>年份选择：</span>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 120 }}
            >
              <Option value="2024">2024年</Option>
              <Option value="2023">2023年</Option>
              <Option value="2022">2022年</Option>
            </Select>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadStatisticsData}
                loading={loading}
              >
                刷新数据
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport(activeTab)}
              >
                导出数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {activeTab === 'industry' && (
        <Card style={{ marginTop: 16 }}>
          <ReactECharts
            option={getLineChartOption(statisticsData.trend || [])}
            style={{ height: '400px' }}
            loading={loading}
          />
        </Card>
      )}
    </div>
  );
};

export default Statistics;
