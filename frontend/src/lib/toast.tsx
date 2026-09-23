import React from 'react';
import baseToast, {
  Toaster as BaseToaster,
  type ToastOptions as BaseToastOptions,
  type Renderable,
  type ValueOrFunction,
  type Toast,
} from 'react-hot-toast';
import { Info, AlertTriangle } from 'lucide-react';

export interface CustomToastOptions extends BaseToastOptions {
  description?: string | React.ReactNode;
}

/**
 * Helper to combine primary title/message and secondary description
 * into a structured two-line layout matching the dark theme palette.
 */
const renderContent = (
  message: ValueOrFunction<Renderable, Toast>,
  description?: string | React.ReactNode
): ValueOrFunction<Renderable, Toast> => {
  if (!description) return message;

  return (t: Toast) => {
    const resolvedMessage = typeof message === 'function' ? message(t) : message;
    return (
      <div className="flex flex-col gap-0.5 text-left max-w-sm">
        <span className="font-semibold text-xs leading-snug text-[#F7F3E6]">
          {resolvedMessage}
        </span>
        <span className="text-[11px] leading-normal text-[#A8A294] font-normal">
          {description}
        </span>
      </div>
    );
  };
};

/**
 * Custom Toast facade that is 100% drop-in compatible with the existing Sonner API
 * while powering notifications under the hood using react-hot-toast.
 */
export const toast = Object.assign(
  (message: ValueOrFunction<Renderable, Toast>, options?: CustomToastOptions) => {
    const { description, ...baseOpts } = options || {};
    return baseToast(renderContent(message, description), baseOpts);
  },
  {
    success: (message: ValueOrFunction<Renderable, Toast>, options?: CustomToastOptions) => {
      const { description, ...baseOpts } = options || {};
      return baseToast.success(renderContent(message, description), baseOpts);
    },

    error: (message: ValueOrFunction<Renderable, Toast>, options?: CustomToastOptions) => {
      const { description, ...baseOpts } = options || {};
      return baseToast.error(renderContent(message, description), baseOpts);
    },

    loading: (message: ValueOrFunction<Renderable, Toast>, options?: CustomToastOptions) => {
      const { description, ...baseOpts } = options || {};
      return baseToast.loading(renderContent(message, description), baseOpts);
    },

    info: (message: ValueOrFunction<Renderable, Toast>, options?: CustomToastOptions) => {
      const { description, ...baseOpts } = options || {};
      return baseToast(renderContent(message, description), {
        icon: <Info className="w-4 h-4 text-[#60A5FA] shrink-0" />,
        ...baseOpts,
      });
    },

    warning: (message: ValueOrFunction<Renderable, Toast>, options?: CustomToastOptions) => {
      const { description, ...baseOpts } = options || {};
      return baseToast(renderContent(message, description), {
        icon: <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />,
        ...baseOpts,
      });
    },

    dismiss: (toastId?: string) => baseToast.dismiss(toastId),
    remove: (toastId?: string) => baseToast.remove(toastId),
    promise: baseToast.promise,
    custom: baseToast.custom,
  }
);

export { BaseToaster as Toaster };
export default toast;
