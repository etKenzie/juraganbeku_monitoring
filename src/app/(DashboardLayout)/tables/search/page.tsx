import { Box } from "@mui/material";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ProductTableList from "@/app/components/apps/ecommerce/ProductTableList/ProductTableList";

const BCrumb = [
  {
    to: "/",
    title: "Dashboard",
  },
  {
    title: "Visit",
  },
];

const SearchTable = () => {
  return (
    <PageContainer title="Search Table" description="this is Search Table">
      {/* breadcrumb */}
      <Breadcrumb title="Visit" items={BCrumb} />
      {/* end breadcrumb */}
      <Box>
        <ProductTableList />
      </Box>
    </PageContainer>
  );
};

export default SearchTable;
