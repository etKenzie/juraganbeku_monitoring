"use client";

import { useSelector } from "@/store/hooks";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import { AppState } from "@/store/store";
import Image from "next/image";
import { getLogoKey } from "@/utils/brands/brandUtils";
import { getCookie } from "cookies-next";

const Logo = () => {
  const { TopbarHeight, isCollapse, activeMode } = useSelector((state: AppState) => state.customizer);
  const brandId = Number(getCookie("brand_id"));

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,
    width: isCollapse ? "60px" : "150px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }));

  const mode = activeMode === "dark" ? "dark" : "light";
  const { light, dark, width, height } = getLogoKey(brandId, mode);
  const logoSrc = mode === "dark" ? dark : light;

  return (
    <LinkStyled href="/">
      <Image src={logoSrc} alt="logo" height={height} width={width} priority />
    </LinkStyled>
  );
};

export default Logo;
