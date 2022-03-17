/**
 * 在扫描阶段，替换真实的 dynamic() 方法，避免在扫描时，将临时模块注册为动态模块。
 */
import React from "react";

export function dynamic(...args: any): React.FunctionComponent {
  return function DynamicPlaceholder() {
    return <div>"dynamic() placeholder"</div>;
  };
}

export default dynamic;
