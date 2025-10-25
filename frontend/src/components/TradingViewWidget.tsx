'use client';

import { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  symbol: string;
  theme?: "light" | "dark";
  fullscreen?: boolean;
}

function TradingViewWidget({
  symbol,
  theme = "light",
  fullscreen = false,
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[TradingViewWidget] Rendering widget')
    console.log('[TradingViewWidget] Props:', { symbol, theme, fullscreen })
    
    if (!container.current) {
      console.log('[TradingViewWidget] Container ref not available')
      return;
    }
    
    console.log('[TradingViewWidget] Clearing container and creating widget')
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Configure widget based on fullscreen mode
    const config: any = {
      autosize: true,
      symbol,
      interval: fullscreen ? "15" : "D",
      theme,
      style: "1",
      locale: "en",
      backgroundColor:
        theme === "dark" ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)",
      support_host: "https://www.tradingview.com",
      enable_publishing: false,
      calendar: false,
    };

    // Fullscreen mode: show all toolbars and features
    if (fullscreen) {
      console.log('[TradingViewWidget] Configuring FULLSCREEN mode')
      config.hide_top_toolbar = false;
      config.hide_side_toolbar = false;
      config.allow_symbol_change = true;
      config.save_image = true;
      config.withdateranges = true;
      config.studies_overrides = {};
      config.overrides = {
        'mainSeriesProperties.candleStyle.upColor': '#10b981',
        'mainSeriesProperties.candleStyle.downColor': '#ef4444',
        'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
        'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444'
      };
    } else {
      console.log('[TradingViewWidget] Configuring REGULAR mode')
      // Regular mode: hide toolbars for clean view
      config.hide_top_toolbar = true;
      config.hide_side_toolbar = true;
      config.allow_symbol_change = false;
      config.save_image = false;
      config.withdateranges = false;
    }

    console.log('[TradingViewWidget] Final config:', config)
    script.innerHTML = JSON.stringify(config);

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    console.log('[TradingViewWidget] Appending widget to container')
    container.current.appendChild(widgetContainer);
    container.current.appendChild(script);
    
    console.log('[TradingViewWidget] Widget setup complete')

    return () => {
      console.log('[TradingViewWidget] Cleaning up widget')
      if (container.current) container.current.innerHTML = "";
    };
  }, [symbol, theme, fullscreen]);

  console.log('[TradingViewWidget] Rendering container with style:', { 
    height: fullscreen ? "100%" : "500px", 
    width: "100%",
    fullscreen 
  })

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ 
        height: fullscreen ? "100%" : "500px", 
        width: "100%"
      }}
    />
  );
}

export default memo(TradingViewWidget);
