import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Box, Menu, Avatar, Typography, Divider, Button, IconButton } from "@mui/material";
import * as dropdownData from "./data";

import { IconMail } from "@tabler/icons-react";
import { Stack } from "@mui/system";
import { useRouter } from "next/navigation";

import { deleteCookie, getCookie } from "cookies-next";

import axios from "axios";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [role, setRole] = useState("");
  const router = useRouter();

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      const storedFullname = localStorage.getItem("fullname");
      const storedEmail = localStorage.getItem("email");
      const storedBrand = localStorage.getItem("brand_name");
      const storedRole = localStorage.getItem("role_id");

      if (storedFullname && storedEmail && storedBrand) {
        setFullname(storedFullname);
        setEmail(storedEmail);
        setBrandName(storedBrand);
        setRole(storedRole || "");
      } else {
        fetchProfile(token).then((data) => {
          if (data) {
            setFullname(data.fullname);
            setEmail(data.email);
            setBrandName(data.brand_name);
            setRole(data.role_id);
          }
        });
      }
    }
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_VISIT_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { fullname, email, brand_name, role_id } = response.data.data;

      // Simpan ke localStorage
      localStorage.setItem("fullname", fullname);
      localStorage.setItem("email", email);
      localStorage.setItem("brand_name", brand_name);
      localStorage.setItem("role_id", role_id);

      return { fullname, email, brand_name, role_id };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const logoutAction = async () => {
    try {
      const token = getCookie("token");

      if (!token) {
        console.error("No token found, user already logged out.");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_VISIT_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Kirim token ke backend
          },
        }
      );
    } catch (error) {
      console.error("Error logging out:", error);
    }

    // Hapus cookies & localStorage
    deleteCookie("token");
    deleteCookie("refresh_token");
    deleteCookie("brand_id");

    localStorage.removeItem("fullname");
    localStorage.removeItem("brand_name");
    localStorage.removeItem("email");
    localStorage.removeItem("role_id");

    console.log("User logged out successfully.");
    // router.push("/login");
  };

  return (
    <Box>
      <IconButton
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}>
        <Avatar
          src={"/images/profile/user-1.jpg"}
          alt={"ProfileImg"}
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "360px",
            p: 4,
          },
        }}>
        <Typography variant="h5">User Profile</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          <Avatar src={"/images/profile/user-1.jpg"} alt={"ProfileImg"} sx={{ width: 95, height: 95 }} />
          <Box>
            <Typography variant="subtitle2" color="textPrimary" fontWeight={600} sx={{ textTransform: "uppercase" }}>
              {fullname}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary" sx={{ textTransform: "uppercase" }}>
              {brandName}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary" display="flex" alignItems="center" gap={1}>
              <IconMail width={15} height={15} />
              {email}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        {dropdownData.profile.map((profile) => (
          <Box key={profile.title}>
            <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
              <Link href={profile.href}>
                <Stack direction="row" spacing={2}>
                  <Box width="45px" height="45px" bgcolor="primary.light" display="flex" alignItems="center" justifyContent="center" flexShrink="0">
                    <Avatar
                      src={profile.icon}
                      alt={profile.icon}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="textPrimary"
                      className="text-hover"
                      noWrap
                      sx={{
                        width: "240px",
                      }}>
                      {profile.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        width: "240px",
                      }}
                      noWrap>
                      {fullname}
                    </Typography>
                  </Box>
                </Stack>
              </Link>
            </Box>
          </Box>
        ))}
        <Box mt={2}>
          {/* <Box bgcolor="primary.light" p={3} mb={3} overflow="hidden" position="relative">
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="h5" mb={2}>
                  Unlimited <br />
                  Access
                </Typography>
                <Button variant="contained" color="primary">
                  Upgrade
                </Button>
              </Box>
              <Image src={"/images/backgrounds/unlimited-bg.png"} width={150} height={183} style={{ height: "auto", width: "auto" }} alt="unlimited" className="signup-bg" />
            </Box>
          </Box> */}
          <Button href="/login" variant="outlined" color="primary" component={Link} fullWidth onClick={logoutAction}>
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
