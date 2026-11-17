import Svg, { Path } from 'react-native-svg';

export const BOOK_SPINE = 'M12 7v14';
export const BOOK_LEFT_PAGE = 'M12 7a4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3';
export const BOOK_RIGHT_PAGE = 'M12 7a4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3';

interface BookLogoProps {
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function BookLogo({ size = 32, color, strokeWidth = 2 }: BookLogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={BOOK_SPINE} />
      <Path d={BOOK_LEFT_PAGE} />
      <Path d={BOOK_RIGHT_PAGE} />
    </Svg>
  );
}
