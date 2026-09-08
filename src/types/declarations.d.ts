declare module "react-native-keyboard-aware-scroll-view" {
  import { Component } from "react";
  import { ScrollViewProps } from "react-native";

  export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
    enableOnAndroid?: boolean;
    extraScrollHeight?: number;
    extraHeight?: number;
    keyboardOpeningTime?: number;
    enableResetScrollToCoords?: boolean;
    viewIsInsideTabBar?: boolean;
  }

  export class KeyboardAwareScrollView extends Component<KeyboardAwareScrollViewProps> {}
}
