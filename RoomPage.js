import * as React from 'react';

import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  findNodeHandle,
  NativeModules,
} from 'react-native';
import { useEffect, useState } from 'react';
import { RoomControls } from './RoomControls';
import { ParticipantView } from './ParticipantView';
import { Participant, Room } from 'livekit-client';
import { useRoom, useParticipant, AudioSession } from 'livekit-react-native';
import { Platform } from 'react-native';

export const RoomPage = ({
  navigation,
  route,
}) => {
  const [, setIsConnected] = useState(false);
  const [room] = useState(
    () =>
      new Room({
        publishDefaults: { simulcast: false },
        adaptiveStream: true,
      })
  );
  const { participants } = useRoom(room);
  const { url, token } = route.params;

  // Connect to room.
  useEffect(() => {
    connectRoom();
    return () => {
      room.disconnect();
      AudioSession.stopAudioSession();
    };
  }, [url, token, room]);

  const connectRoom = async () => {
    await AudioSession.startAudioSession();
    room.connect(url, token, {}).then(() => {
      console.log('connected to ', url, ' ', token);
      setIsConnected(true);
    });
  };

  // Setup views.
  const stageView = participants.length > 0 && (
    <ParticipantView participant={participants[0]} style={styles.stage} />
  );

  const renderParticipant = ({ item }) => {
    return (
      <ParticipantView participant={item} style={styles.otherParticipantView} />
    );
  };

  const otherParticipantsView = participants.length > 0 && (
    <FlatList
      data={participants}
      renderItem={renderParticipant}
      keyExtractor={(item) => item.sid}
      horizontal={true}
      style={styles.otherParticipantsList}
    />
  );

  const { cameraPublication, microphonePublication } =
    useParticipant(room.localParticipant);

  return (
    <View style={styles.container}>
      {stageView}
      {otherParticipantsView}
      <RoomControls
        micEnabled={false}
        setMicEnabled={(enabled) => {
          room.localParticipant.setMicrophoneEnabled(enabled);
        }}
        cameraEnabled={false}
        setCameraEnabled={(enabled) => {
          room.localParticipant.setCameraEnabled(enabled);
        }}
        onDisconnectClick={() => {
          navigation.pop();
        }}
      />
    </View>
  );
};

function isTrackEnabled(pub) {
  return !(pub.isMuted ?? true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    width: '100%',
  },
  otherParticipantsList: {
    width: '100%',
    height: 150,
    flexGrow: 0,
  },
  otherParticipantView: {
    width: 150,
    height: 150,
  },
});