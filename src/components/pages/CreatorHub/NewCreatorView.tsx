import React from 'react';
import NoChannelView from './NoChannelView';

/**
 * The hub landing for an account with no channel yet: the same card as every
 * other "no channel" screen, with its own destination (the channel creation page).
 * The landing page already provides the top spacing, so this one adds none.
 */
const NewCreatorView: React.FC = () => <NoChannelView createPath="/create-channel" className="!pt-8" />;

export default NewCreatorView;
