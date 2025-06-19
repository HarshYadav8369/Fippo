import React from 'react';
import nookies from 'nookies';

// Higher-Order Component to protect pages with server-side redirect.
const withAuth = (WrappedComponent) => {
  const Wrapper = (props) => <WrappedComponent {...props} />;

  Wrapper.getInitialProps = async (ctx) => {
    const { fippo_token } = nookies.get(ctx);

    // Not logged in → redirect to home page.
    if (!fippo_token) {
      if (ctx.res) {
        ctx.res.writeHead(302, { Location: '/' });
        ctx.res.end();
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
      return {};
    }

    // Merge WrappedComponent.getInitialProps if present
    let componentProps = {};
    if (WrappedComponent.getInitialProps) {
      componentProps = await WrappedComponent.getInitialProps(ctx);
    }

    return { ...componentProps };
  };

  return Wrapper;
};

export default withAuth;
