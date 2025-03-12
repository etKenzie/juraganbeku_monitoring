"use client";
import React from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { FormikProps } from "formik";

interface AuthLoginProps {
  formik: FormikProps<{
    username: string;
    password: string;
    rememberMe: boolean;
  }>;
  isLoading: boolean;
  error: string;
  subtitle: React.ReactNode;
}

const AuthLogin: React.FC<AuthLoginProps> = ({
  formik,
  isLoading,
  error,
  subtitle,
}) => {
  return (
    <>
      <Box>
        {/* <Typography fontWeight="700" variant="h3" mb={1}>
          Tokopandai
        </Typography> */}
        {/* <Typography variant="subtitle1" color="textSecondary" mb={3}>
          Your Admin Dashboard
        </Typography> */}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={2}>
            <TextField
              id="username"
              name="username"
              label="Username"
              variant="outlined"
              fullWidth
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
            />

            <TextField
              id="password"
              name="password"
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.rememberMe}
                    onChange={formik.handleChange}
                    name="rememberMe"
                  />
                }
                label="Remember me"
              />
            </FormGroup>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              color="primary"
              variant="contained"
              size="large"
              fullWidth
              type="submit"
              disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
          </Stack>
        </form>
      </Box>
      {subtitle}
    </>
  );
};

export default AuthLogin;
