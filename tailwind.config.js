module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'rotate-y': 'rotateY 10s linear infinite',  // Slow rotation of the container
        fall: 'fall 2s ease-in-out infinite',       // Falling balls animation
      },
      keyframes: {
        rotateY: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' }, // Complete rotation around Y-axis
        },
        fall: {
          '0%': { transform: 'translateY(-40px)' }, // Start above the container
          '100%': { transform: 'translateY(100px)' }, // End inside the container (adjust based on size)
        },
      },
      spacing: {
        '500': '500px', // Adjust this based on your scene size
      },
      perspective: {
        500: '500px', // Provides depth for 3D effect
      },
    },
  },
  plugins: [],
};
