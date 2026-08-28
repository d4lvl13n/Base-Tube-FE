import styled from 'styled-components';

/**
 * The page shell.
 *
 * Everything inside Content Studio is Tailwind — the one styled component left
 * is the measure: a narrow column, because the page is a list of file names and
 * a list of file names does not want 1200px of horizontal travel.
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  padding: 1.5rem;
  padding-top: 4rem;
`;
