"use client";

import { useSelector } from "@/store/hooks";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import { AppState } from "@/store/store";
import Image from "next/image";

const Logo = () => {
  const { TopbarHeight, isCollapse, activeMode } = useSelector(
    (state: AppState) => state.customizer
  );

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,
    width: isCollapse ? "50px" : "230px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }));

  const logoSrc =
    activeMode === "dark"
      ? "/images/logos/topan.png"
      : "/images/logos/topan.png";

  return (
    <LinkStyled href="/">
      <Image src={logoSrc} alt="logo" height={50} width={230} priority />
    </LinkStyled>
  );
};

export default Logo;
