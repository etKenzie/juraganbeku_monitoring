import { Box, Grid } from "@mui/material";
import React from "react";
import InvoiceSummaryCard from "../invoice/InvoiceSummaryCard";

interface TileDef {
  title: string;
  value: string | number;
  isCurrency?: boolean;
  color?: string;
  fontWeight?: number;
}

interface SummaryTilesProps {
  tiles: TileDef[];
  md?: number; // columns per row, default 4
}

const SummaryTiles: React.FC<SummaryTilesProps> = ({ tiles, md = 4 }) => {
  return (
    <Grid container spacing={3} alignItems="stretch">
      {tiles.map((tile, idx) => (
        <Grid item xs={12} sm={6} md={md} key={tile.title + idx}>
          <Box sx={{ color: tile.color, fontWeight: tile.fontWeight, height: "100%" }}>
            <InvoiceSummaryCard
              title={tile.title}
              value={tile.value}
              isCurrency={tile.isCurrency}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryTiles; 