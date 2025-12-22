"use client";

import React from "react";
import { Skeleton, Grid, Card, Space } from "@arco-design/web-react";

const { Row, Col } = Grid;

export default function Loading() {
  return (
    <div className="p-4">
      {/* 筛选栏骨架 */}
      <Card className="mb-4">
        <Row gutter={24}>
          <Col span={6}>
            <Skeleton text={{ rows: 2, width: ["30%", "100%"] }} animation />
          </Col>
          <Col span={6}>
            <Skeleton text={{ rows: 2, width: ["30%", "100%"] }} animation />
          </Col>
          <Col span={6}>
            <Skeleton text={{ rows: 2, width: ["30%", "100%"] }} animation />
          </Col>
          <Col span={6}>
            <Skeleton text={{ rows: 2, width: ["30%", "100%"] }} animation />
          </Col>
        </Row>
      </Card>

      {/* 表格骨架 */}
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Skeleton text={{ rows: 1, width: "100%" }} animation />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} text={{ rows: 1, width: "100%" }} animation />
          ))}
        </Space>
      </Card>
    </div>
  );
}
