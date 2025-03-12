"use client";
import Link from "next/link";
import { Grid, Box, Card, Stack, Typography, CircularProgress } from "@mui/material";
import { useFormik } from "formik";

import { useState, useEffect } from "react";

import * as Yup from "yup";
import axios from "axios";
import { useRouter } from "next/navigation";
import { setCookie, deleteCookie } from "cookies-next";

// components
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/LogoLogin";
import PageContainer from "@/app/components/container/PageContainer";
import AuthLogin from "../../authForms/AuthLogin";

export default function Login2() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const COOKIE_SECURE = process.env.NEXT_PUBLIC_COOKIE_SECURE === "true";
  const COOKIE_SAMESITE = (process.env.NEXT_PUBLIC_COOKIE_SAMESITE as "lax" | "strict" | "none") || "lax";

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
    validationSchema: Yup.object({
      username: Yup.string().required("Username is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError("");

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_VISIT_URL}/auth/login`,
          {
            username: values.username,
            password: values.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data && response.data.data && response.data.data.token) {
          const { token, refreshToken, brand_id } = response.data.data;

          // Set cookies
          setCookie("token", token.toString(), {
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAMESITE,
          });
          setCookie("refresh_token", refreshToken, { secure: COOKIE_SECURE, sameSite: COOKIE_SAMESITE });
          setCookie("brand_id", brand_id, {
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAMESITE,
          });

          // Redirect to home page on successful login
          router.push("/");
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.data?.errors) {
            setError(Object.values(error.response.data.errors).join(", "));
          } else {
            setError(error.response?.data?.message || "An unexpected error occurred");
          }
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <PageContainer title="Login Page" description="this is Sample page">
      <Box
        sx={{
          position: "relative",
          "&:before": {
            content: '""',
            background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite",
            position: "absolute",
            height: "100%",
            width: "100%",
            opacity: "0.3",
          },
        }}>
        <Grid container spacing={0} justifyContent="center" sx={{ height: "100vh" }}>
          <Grid item xs={12} sm={12} lg={5} xl={4} display="flex" justifyContent="center" alignItems="center">
            <Card elevation={9} sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "450px" }}>
              <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                <Logo />
              </Box>
              <AuthLogin formik={formik} isLoading={isLoading} error={error} subtitle={""} />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
