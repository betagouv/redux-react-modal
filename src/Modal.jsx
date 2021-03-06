import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'

import { closeModal } from './actionCreators'

const initialState = {
  display: false,
  translate: true,
}

export class RawModal extends Component {
  constructor() {
    super()
    this.state = initialState
  }

  componentDidMount() {
    this.handleActiveChange()
  }

  componentDidUpdate(prevProps) {
    const {
      dispatch,
      isClosingOnLocationChange,
      name,
      location: { pathname },
    } = this.props
    if (isClosingOnLocationChange && pathname !== prevProps.location.pathname) {
      dispatch(closeModal(name))
    }

    this.handleActiveChange(prevProps)
  }

  componentWillUnmount() {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout)
    }
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout)
    }
  }

  handleActiveChange = (prevProps = {}) => {
    const { isActive, transitionDuration } = this.props

    if (isActive && !prevProps.isActive) {
      // Opening
      this.setState({
        display: true,
      })
      this.openTimeout = setTimeout(() => {
        this.setState({
          translate: false,
        })
      }, transitionDuration)
      document.addEventListener('backbutton', this.onCloseClick)
    } else if (!isActive && prevProps.isActive) {
      // Closing
      this.setState({
        translate: true,
      })
      this.closeTimeout = setTimeout(() => {
        this.setState({
          display: false,
        })
      }, transitionDuration)
      document.removeEventListener('backbutton', this.onCloseClick)
    }
  }

  onCloseClick = event => {
    const { dispatch, name, isActive, isUnclosable, onCloseClick } = this.props

    if (isUnclosable || !isActive) return true
    if (onCloseClick) {
      onCloseClick()
    }
    dispatch(closeModal(name))
    event.preventDefault()
    return event
  }

  stopPropagation = event => {
    event.nativeEvent.stopImmediatePropagation() // Prevent click bubbling and closing modal
    event.stopPropagation()
    return event
  }

  transform() {
    const { fromDirection } = this.props
    const { translate } = this.state

    if (!translate) return ''
    switch (fromDirection) {
      case 'top':
        return 'translate(0, -100vh)'
      case 'bottom':
        return 'translate(0, 100vh)'
      case 'left':
        return 'translate(-100vw, 0)'
      case 'right':
        return 'translate(100vw, 0)'
      default:
        return {}
    }
  }

  render() {
    const {
      closeImgPath,
      extraClassName,
      fullscreen,
      hasCloseButton,
      isUnclosable,
      maskColor,
      contentElement,
      transitionDuration,
    } = this.props
    const { display } = this.state

    return (
      <div
        className={classnames('modal', extraClassName, {
          active: display,
        })}
        role="button"
        style={{ backgroundColor: maskColor }}
        onClick={this.onCloseClick}
        onKeyPress={this.onCloseClick}
        tabIndex={0}
      >
        <div className="container">
          <div
            className={classnames('modal-dialog', {
              fullscreen,
            })}
            onClick={e => this.stopPropagation(e)}
            onKeyPress={e => this.stopPropagation(e)}
            role="button"
            style={{
              transform: this.transform(),
              transitionDuration: `${transitionDuration}ms`,
            }}
            tabIndex={0}
          >
            {!isUnclosable &&
              hasCloseButton &&
              closeImgPath && (
                <button
                  className="close"
                  onClick={this.onCloseClick}
                  type="button"
                >
                  <img alt='modal close' src={closeImgPath} />
                </button>
              )}
            {contentElement &&
              contentElement.type && (
                <div className="modal-content">
                  {contentElement}
                </div>
              )
            }
          </div>
        </div>
      </div>
    )
  }
}

RawModal.defaultProps = {
  closeImgPath: null,
  contentElement: null,
  extraClassName: null,
  fromDirection: 'bottom',
  fullscreen: false,
  hasCloseButton: true,
  isActive: false,
  isClosingOnLocationChange: null,
  isUnclosable: false,
  maskColor: 'rgba(0, 0, 0, 0.8)',
  onCloseClick: null,
  transitionDuration: 250,
}

RawModal.propTypes = {
  closeImgPath: PropTypes.string,
  contentElement: PropTypes.node,
  dispatch: PropTypes.func.isRequired,
  extraClassName: PropTypes.string,
  fromDirection: PropTypes.string,
  fullscreen: PropTypes.bool,
  hasCloseButton: PropTypes.bool,
  isActive: PropTypes.bool,
  isClosingOnLocationChange: PropTypes.func,
  isUnclosable: PropTypes.bool,
  location: PropTypes.object.isRequired,
  maskColor: PropTypes.string,
  name: PropTypes.string.isRequired,
  onCloseClick: PropTypes.func,
  transitionDuration: PropTypes.number
}

function mapStateTopProps (state, ownProps) {
  const { name } = ownProps
  const { modals } = state
  const { config, contentElement, isActive } = modals[name] || {}
  return Object.assign({ contentElement, isActive }, config)
}

export const Modal = compose(
  withRouter,
  connect(mapStateTopProps)
)(RawModal)

export default Modal
