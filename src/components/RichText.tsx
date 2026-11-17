import { Fragment, ReactNode, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Block, InlineToken, parseRichText } from '../utils/richText';
import { useAppTheme } from '../theme';

interface RichTextProps {
  content: string;
  color: string;
  inverted?: boolean;
  myUsername?: string;
}

function Spoiler({ children, inverted }: { children: ReactNode; inverted: boolean }) {
  const theme = useAppTheme();
  const [revealed, setRevealed] = useState(false);
  const hidden = inverted ? '#1E1B4B' : theme.colors.inverseSurface;
  return (
    <Text
      onPress={() => setRevealed(true)}
      accessibilityRole="button"
      accessibilityLabel={revealed ? undefined : 'Spoiler oculto. Toca para mostrarlo'}
      style={revealed ? undefined : { backgroundColor: hidden, color: hidden }}
    >
      {children}
    </Text>
  );
}

export function RichText({ content, color, inverted = false, myUsername }: RichTextProps) {
  const theme = useAppTheme();

  const renderInline = (tokens: InlineToken[], key: string): ReactNode[] =>
    tokens.map((token, index) => {
      const id = `${key}-${index}`;
      switch (token.type) {
        case 'text':
          return <Fragment key={id}>{token.value}</Fragment>;
        case 'bold':
          return (
            <Text key={id} style={styles.bold}>
              {renderInline(token.children, id)}
            </Text>
          );
        case 'italic':
          return (
            <Text key={id} style={styles.italic}>
              {renderInline(token.children, id)}
            </Text>
          );
        case 'spoiler':
          return (
            <Spoiler key={id} inverted={inverted}>
              {renderInline(token.children, id)}
            </Spoiler>
          );
        case 'strike':
          return (
            <Text key={id} style={styles.strike}>
              {renderInline(token.children, id)}
            </Text>
          );
        case 'code':
          return (
            <Text
              key={id}
              style={[styles.code, { backgroundColor: inverted ? 'rgba(0,0,0,0.25)' : theme.colors.outlineVariant }]}
            >
              {token.value}
            </Text>
          );
        case 'link':
          return (
            <Text
              key={id}
              style={[styles.link, { color: inverted ? color : theme.colors.primary }]}
              onPress={() => Linking.openURL(token.href)}
              accessibilityRole="link"
            >
              {token.href}
            </Text>
          );
        case 'mention': {
          const isMe = myUsername?.toLowerCase() === token.username.toLowerCase();
          return (
            <Text
              key={id}
              style={[
                styles.bold,
                isMe
                  ? { backgroundColor: theme.colors.highlight, color: theme.colors.onHighlight }
                  : { color: inverted ? color : theme.colors.primary },
              ]}
            >
              @{token.username}
            </Text>
          );
        }
        default:
          return null;
      }
    });

  const renderBlock = (block: Block, index: number) => {
    const key = `b${index}`;
    if (block.type === 'codeBlock') {
      return (
        <View key={key} style={[styles.codeBlock, { backgroundColor: inverted ? 'rgba(0,0,0,0.25)' : theme.colors.inverseSurface }]}>
          <Text style={[styles.mono, { color: inverted ? color : theme.colors.inverseOnSurface }]}>{block.value}</Text>
        </View>
      );
    }
    if (block.type === 'list') {
      return (
        <View key={key} style={styles.list}>
          {block.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.listItem}>
              <Text variant="bodyMedium" style={{ color }}>
                {block.ordered ? `${itemIndex + 1}.` : '•'}
              </Text>
              <Text variant="bodyMedium" style={[styles.flex, { color }]}>
                {renderInline(item, `${key}-${itemIndex}`)}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return (
      <Text key={key} variant="bodyMedium" style={{ color }}>
        {block.lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 ? '\n' : null}
            {renderInline(line, `${key}-${lineIndex}`)}
          </Fragment>
        ))}
      </Text>
    );
  };

  return <View style={styles.container}>{parseRichText(content).map(renderBlock)}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 4,
  },
  link: {
    textDecorationLine: 'underline',
  },
  codeBlock: {
    borderRadius: 8,
    padding: 8,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  list: {
    gap: 2,
  },
  listItem: {
    flexDirection: 'row',
    gap: 6,
  },
  flex: {
    flex: 1,
  },
});
