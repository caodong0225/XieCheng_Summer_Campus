"use client";

import { Layout } from "antd";
import { useState } from "react";
import { getSiteConfig } from "@/store/site_config";

const { Footer } = Layout;

export default function SiteFooter() {
  const [siteConfig, setSiteConfig] = useState(getSiteConfig());

  return (
    <Footer>
      &copy;&nbsp;{siteConfig["copyRightFooterName"]}{siteConfig["siteVersion"]}
      {/* TODO */}
    </Footer>
  );
}
