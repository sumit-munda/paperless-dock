import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import type { AppDispatch, RootState } from "./store";

// redux/hooks.ts
// Typed versions of useDispatch and useSelector for the app

// Use throughout the app instead of plain 'useDispatch' and 'useSelector'

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
