'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Box, Menu, Avatar, Typography, Divider, Button, IconButton } from "@mui/material";
import * as dropdownData from "./data";
import { IconMail } from "@tabler/icons-react";
import { Stack } from "@mui/system";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const { user, signOut } = useAuth();

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClick3 = () => {
    setAnchorEl2(null);
  };

  useEffect(() => {
    if (user) {
      // Set email from Supabase user
      setEmail(user.email || "");
      // Set fullname from user metadata or email
      setFullname(user.user_metadata?.full_name || user.email || "");
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
    
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClick3}
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
            <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
              {fullname}
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
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
