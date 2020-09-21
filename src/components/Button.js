import React from 'react';

function Button(props) {

    const {direction, setDirectionWithTimeout, isDisabled} = props;
    return (
        <button
            onClick={() => setDirectionWithTimeout(direction)}
            disabled={isDisabled}
        >
            {direction}
        </button>
    );
}

export default Button;