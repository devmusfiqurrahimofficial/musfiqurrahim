// .withTypes() is a no-op in JS. Kept so a TS move only touches this file.
import { useDispatch, useSelector } from 'react-redux'

export const useAppDispatch = useDispatch.withTypes()
export const useAppSelector = useSelector.withTypes()
