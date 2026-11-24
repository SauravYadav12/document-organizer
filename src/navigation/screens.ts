import type { NavigatorScreenParams } from '@react-navigation/native';

export type LibraryStackParamList = {
  Home: undefined;
  Month: { year: number };
  DocumentDetail: { documentId: number };
  MoveDocument: { documentId: number };
  DocumentViewer: { year: number; month: number; documentId: number };
  Settings: undefined;
};

export type CaptureStackParamList = {
  Capture: undefined;
  ConfirmDate: { photoUri: string };
};

export type RootTabParamList = {
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  CaptureTab: NavigatorScreenParams<CaptureStackParamList>;
  HistoryTab: undefined;
};
