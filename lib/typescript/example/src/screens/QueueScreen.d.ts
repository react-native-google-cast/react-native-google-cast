import { NavigationComponentProps } from 'react-native-navigation';
export interface QueueScreenProps extends NavigationComponentProps {
}
declare function QueueScreen({}: QueueScreenProps): JSX.Element;
declare namespace QueueScreen {
    var options: {
        topBar: {
            title: {
                alignment: string;
                color: string;
                text: string;
            };
            rightButtons: {
                id: string;
                component: {
                    name: string;
                };
            }[];
        };
    };
}
export default QueueScreen;
