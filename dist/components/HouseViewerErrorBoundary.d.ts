import React from 'react';
import type { RenderModel } from '../model/normalizeHouseViewerModel';
type Props = {
    renderModel: RenderModel;
    children: React.ReactNode;
};
type State = {
    error: Error | null;
    componentStack?: string;
};
export declare class HouseViewerErrorBoundary extends React.Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, info: React.ErrorInfo): void;
    componentDidUpdate(prevProps: Props): void;
    render(): string | number | boolean | Iterable<React.ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
}
export {};
