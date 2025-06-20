"use client";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import {
    Box,
    IconButton,
    MenuItem,
    Select,
    Tooltip,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import DashboardCard from "../../shared/DashboardCard";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type SegmentType = "business_type" | "sub_business_type";

interface NOOSegmentChartProps {
  data: OrderData[];
}

const NOOSegmentChart = ({ data }: NOOSegmentChartProps) => {
  const theme = useTheme();
  const [segmentType, setSegmentType] = useState<SegmentType>("business_type");
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Get first order for each store
  const storeFirstOrders = React.useMemo(() => {
    return data.reduce((acc: Record<string, { segment: string; subSegment: string; order: OrderData }>, order) => {
      const storeId = order.user_id;
      if (!acc[storeId] || new Date(order.order_date) < new Date(acc[storeId].order.order_date)) {
        acc[storeId] = {
          segment: order.business_type || "OTHER",
          subSegment: order.sub_business_type || "OTHER",
          order,
        };
      }
      return acc;
    }, {});
  }, [data]);

  // Group by segment or sub-segment
  const grouped = React.useMemo(() => {
    const groupKey = segmentType === "business_type" ? "segment" : "subSegment";
    const groups: Record<string, number> = {};
    Object.values(storeFirstOrders).forEach((entry) => {
      const key = entry[groupKey] || "OTHER";
      groups[key] = (groups[key] || 0) + 1;
    });
    return groups;
  }, [storeFirstOrders, segmentType]);

  const segments = Object.keys(grouped).sort();
  const values = segments.map((key) => grouped[key]);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const options: any = {
    chart: {
      id: "noo-segment-chart",
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
      height: 280,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
        distributed: true,
        endingShape: "rounded",
        cursor: "pointer",
      },
    },
    colors: [theme.palette.primary.main],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: false,
    },
    grid: {
      show: false,
    },
    xaxis: {
      categories: segments,
      labels: {
        show: !isSmallScreen,
        style: {
          fontSize: "12px",
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      style: {
        fontSize: "12px",
      },
    },
  };

  const series = [
    {
      name: segmentType === "business_type" ? "Segment" : "Sub Segment",
      data: values,
    },
  ];

  const handleDownload = async () => {
    if (!isClient) return;
    const ApexCharts = (await import("apexcharts")).default;
    ApexCharts.exec("noo-segment-chart", "updateOptions", {
      title: {
        text: `NOO by ${segmentType === "business_type" ? "Segment" : "Sub Segment"}`,
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: theme.palette.mode === "dark" ? "#fff" : "#111",
        },
      },
    }).then(() => {
      ApexCharts.exec("noo-segment-chart", "dataURI").then(
        (response: { imgURI: string }) => {
          ApexCharts.exec("noo-segment-chart", "updateOptions", {
            title: { text: undefined },
          });
          const downloadLink = document.createElement("a");
          downloadLink.href = response.imgURI;
          downloadLink.download = `NOO_Segment_${segmentType}_${new Date().toLocaleDateString()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      );
    });
  };

  return (
    <DashboardCard
      title={`NOO by ${segmentType === "business_type" ? "Segment" : "Sub Segment"}`}
      action={
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Download Chart">
            <IconButton onClick={handleDownload} size="small">
              <IconDownload size={20} />
            </IconButton>
          </Tooltip>
          <Select
            value={segmentType}
            onChange={(e) => setSegmentType(e.target.value as SegmentType)}
            size="small"
            sx={{ minWidth: '150px' }}
          >
            <MenuItem value="business_type">Segment</MenuItem>
            <MenuItem value="sub_business_type">Sub Segment</MenuItem>
          </Select>
        </Box>
      }
    >
      <Box height="300px">
        {isClient && (
          <Chart
            options={options}
            series={series}
            type="bar"
            height={280}
            width={"100%"}
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default NOOSegmentChart; 