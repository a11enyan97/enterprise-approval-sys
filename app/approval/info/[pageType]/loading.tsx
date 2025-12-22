"use client";

import React from "react";
import { Skeleton, Grid, Card } from "@arco-design/web-react";

const { Row, Col } = Grid;

export default function Loading() {
  return (
    <div className="p-4">
      <Card>
        {/* 标题区 */}
        <div className="mb-6">
          <Skeleton text={{ rows: 1, width: "30%" }} className="mb-2" animation />
          <Skeleton text={{ rows: 1, width: "50%" }} animation />
        </div>

        {/* 表单字段区 */}
        <Row gutter={24}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col span={12} key={i} className="mb-6">
              <Skeleton text={{ rows: 2, width: ["20%", "100%"] }} animation />
            </Col>
          ))}
        </Row>

        <Row gutter={24}>
          <Col span={24} className="mb-6">
            <Skeleton
              text={{ rows: 4, width: ["20%", "100%", "100%", "100%"] }}
              animation
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
