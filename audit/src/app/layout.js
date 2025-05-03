"use client";
import { getSiteConfig } from "@/store/site_config";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
// const inter = Inter({ subsets: ['latin'] })
// import { HydrationOverlay } from "@builder.io/react-hydration-overlay";
import { useEffect, useState } from 'react'
import { ConfettiProvider } from '@/components/common/confetti';
import {ProgressProvider} from "@bprogress/next/app";

const RootLayout = ({ children }) => {
  const [DOMready, setDOMready] = useState(false);

  useEffect(()=>{
    setDOMready(true);
    return () => {
      setDOMready(false)
    }
  }, [])

  return (
    <html lang="zh">
      <head>
        <title>{getSiteConfig()["siteName"] || "Singularity"}</title>
        {/* Filter Decrapted "findDOMNode" Warning */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
                    const consoleError = console.error.bind(console);
                    console.error = (errObj, ...args) => {
                        if (args.includes('findDOMNode')
                        ) {
                            return;
                        }
                        consoleError(errObj, ...args);
                    };`,
          }}
        />
      </head>

      <body /*className={inter.className}*/>
      {/* <HydrationOverlay> */}
        <ConfettiProvider DOMready={DOMready}>
          <ProgressProvider
            options={{ showSpinner: false }}
            shallowRouting
          >
            <AntdRegistry>{children}</AntdRegistry>
          </ProgressProvider>
        </ConfettiProvider>
      {/* </HydrationOverlay> */}
      </body>
    </html>
  );
};

export default RootLayout;
