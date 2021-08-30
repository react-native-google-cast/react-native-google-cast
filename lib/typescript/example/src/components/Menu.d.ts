import React from 'react';
import { AlertButton } from 'react-native';
export interface MenuProps {
    children: React.ReactNode;
    options: Array<{
        onPress?: () => void;
        style?: AlertButton['style'];
        text: string;
    }>;
}
/**
 * An options menu that renders as action sheet on iOS and popup menu on Android.
 */
export default function Menu({ children, options }: MenuProps): JSX.Element;
