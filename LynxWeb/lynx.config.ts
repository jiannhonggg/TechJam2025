//@ts-expect-error
import { defineConfig } from '@lynx-js/rspeedy';
//@ts-expect-error
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';

export default defineConfig({
  plugins: [pluginReactLynx()],
  environments: {
    web: {
      output: {
        assetPrefix: '/',
      },
    },
    lynx: {},
  },
});