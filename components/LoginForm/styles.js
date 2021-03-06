import css from 'styled-jsx/css'

export default css`
  form {
    margin: 0 auto;
    max-width: 700px;
  }

  label {
    display: block;
  }

  input[type="text"],
  input[type="password"] {
    /* subtract padding */
    width: calc(100% - 20px);
    margin-bottom: 15px;
  }
`;
