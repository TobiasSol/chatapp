/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdmwqyxrfihpuuxuycmr.supabase.co'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      'expo-constants': 'expo-constants/web',
      'expo-device': 'expo-device/web',
      'expo-notifications': 'expo-notifications/web'
    }
    
    config.module.rules.push({
      test: /\.js$/,
      exclude: /node_modules[/\\](?!react-native-web|expo.*)/,
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: ['@babel/plugin-proposal-class-properties']
      }
    })

    return config
  },
  transpilePackages: [
    'react-native-web',
    'expo-constants',
    'expo-device',
    'expo-notifications',
    '@expo/vector-icons'
  ]
}

module.exports = nextConfig