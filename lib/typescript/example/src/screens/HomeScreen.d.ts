import { NavigationComponentProps } from 'react-native-navigation';
export interface HomeScreenProps extends NavigationComponentProps {
}
declare function HomeScreen({ componentId }: HomeScreenProps): JSX.Element;
declare namespace HomeScreen {
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
export default HomeScreen;
