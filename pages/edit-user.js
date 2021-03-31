import React, { useState } from 'react'
import { Form } from 'react-bootstrap'
import { getUser } from '../src/graphql/queries'
import { createUser, updateUser } from '../src/graphql/mutations'
import { withSSRContext } from 'aws-amplify'
import { API } from '@aws-amplify/api'
import { Auth } from '@aws-amplify/auth'
import { Storage } from '@aws-amplify/storage'
import { AmplifyS3Image } from '@aws-amplify/ui-react'
import { v4 as uuid } from 'uuid'
import ImageUploader from '../components/ImageUploader'
import Navbar from '../components/Navbar'

export async function getServerSideProps({ req, res }) {
  const { Auth, API } = withSSRContext({ req })
  try {
    const user = await Auth.currentAuthenticatedUser()
    const response = await API.graphql({
      query: getUser,
      variables: { id: user.attributes.sub },
    })
    if (response.data.getUser) {
      return {
        props: {
          mode: 'EDIT',
          user: response.data.getUser,
          error: false,
        },
      }
    } else {
      return {
        props: {
          mode: 'ADD',
          error: false,
        },
      }
    }
  } catch (err) {
    console.log(err)
    return {
      props: {
        error: true,
      },
    }
  }
}

const EditUser = ({ user, error, mode }) => {
  const [firstName, setFirstName] = useState(mode === 'EDIT' ? user.firstName : '')
  const [secondName, setSecondName] = useState(mode === 'EDIT' ? user.lastName : '')
  const [description, setDescription] = useState(mode === 'EDIT' ? user.description : '')

  const [editImage, setEditImage] = useState(!user.image)
  const [userImage, setUserImage] = useState(null)

  const imageUploadHandler = (event) => {
    setUserImage(event.target.files[0])
  }

  const submitHandler = async (event) => {
    event.preventDefault()
    const currentUser = await Auth.currentAuthenticatedUser()
    try {
      let key = null
      if (userImage) {
        key = `${uuid()}${user.firstName}`

        if (user.image) {
          await Storage.remove(user.image)
        }
        await Storage.put(key, userImage, {
          contentType: userImage.type,
        })
      }
      const result = await API.graphql({
        query: mode === 'EDIT' ? updateUser : createUser,
        variables: {
          input: {
            id: currentUser.attributes.sub,
            image: userImage ? key : user.image,
            firstName: firstName,
            lastName: secondName,
            description: description,
            image: userImage ? key : user.image,
          },
        },
      })
      console.log(result)
      window.location.href = '/'
    } catch (err) {
      console.log(err)
    }
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <h1>Something Went Wrong! Please Try Again Later.</h1>
      </div>
    )
  }
  return (
    <div className='d-flex flex-column justify-content-center w-100 h-100'>
      <Navbar />
      <h1 className='align-self-center'>Edit User Details</h1>
      <Form className='w-50 align-self-center'>
        {editImage && <ImageUploader imageUploadHandler={imageUploadHandler} image={userImage} />}
        {!editImage && (
          <div>
            <button
              type='button'
              className='btn m-2 btn-outline-primary'
              onClick={() => {
                setEditImage(true)
              }}
            >
              Edit Image
            </button>
            <AmplifyS3Image imgKey={user.image} />
          </div>
        )}

        <Form.Group className='mt-2' controlId='firstName'>
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type='text'
            value={firstName}
            placeholder='Enter Your First Name'
            onChange={(event) => {
              setFirstName(event.target.value)
            }}
          />
        </Form.Group>
        <Form.Group className='mt-2' controlId='secondName'>
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type='text'
            value={secondName}
            placeholder='Enter Your Last Name'
            onChange={(event) => {
              setSecondName(event.target.value)
            }}
          />
        </Form.Group>
        <Form.Group className='mt-2' controlId='description'>
          <Form.Label>Description</Form.Label>
          <Form.Control
            as='textarea'
            value={description}
            rows={5}
            placeholder='Enter Your Description'
            onChange={(event) => {
              setDescription(event.target.value)
            }}
          />
        </Form.Group>
        <button type='submit' onClick={submitHandler} className='btn btn-primary'>
          Submit
        </button>
      </Form>
    </div>
  )
}
export default EditUser
