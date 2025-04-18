// File location: ./babel.config.js
module.exports = function(api) {
    api.cache(true);
    
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        [
          'transform-inline-environment-variables',
          {
            include: 'TAMAGUI_TARGET',
          },
        ],
        [
          '@tamagui/babel-plugin',
          {
            components: ['tamagui'],
            config: './tamagui.config.ts',
            logTimings: true,
            disableExtraction: process.env.NODE_ENV === 'development',
          },
        ],
        'react-native-reanimated/plugin',
      ],
    };
  };