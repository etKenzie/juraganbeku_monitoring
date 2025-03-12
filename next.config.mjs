const nextConfig = {
  reactStrictMode: false,

  async rewrites() {
    const routes = [
      {
        source: "/login",
        destination: "/auth/auth2/login",
      },
    ];

    console.log("Rewrites loaded:", routes); // Debugging
    return routes;
  },
};

export default nextConfig;
