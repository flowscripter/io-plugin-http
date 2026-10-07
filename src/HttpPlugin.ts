import { PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT } from "@flowscripter/pluggable-io-framework-api";
import type { ExtensionDescriptor, Plugin } from "@flowscripter/dynamic-plugin-framework/plugin";
import { httpIOProviderFactory, httpsIOProviderFactory } from "./HttpIOProviderFactory.ts";

const extensionDescriptors: ExtensionDescriptor[] = [
  httpIOProviderFactory,
  httpsIOProviderFactory,
].map((factory) => ({
  extensionPoint: PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT,
  factory: { create: () => Promise.resolve(factory) },
}));

/** Registers one provider factory for `http` and one for `https`. */
const httpPlugin: Plugin = { extensionDescriptors };

export default httpPlugin;
