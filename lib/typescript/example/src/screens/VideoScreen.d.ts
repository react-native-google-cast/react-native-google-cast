import { NavigationComponentProps } from 'react-native-navigation';
import Video from '../models/Video';
export interface VideoScreenProps extends NavigationComponentProps {
    video: Video;
}
declare function VideoScreen({ componentId, video }: VideoScreenProps): JSX.Element;
declare namespace VideoScreen {
    var options: {
        topBar: {
            title: {
                alignment: string;
                color: string;
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
export default VideoScreen;
