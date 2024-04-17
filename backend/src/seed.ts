/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import { floor, random } from 'lodash';
import axios from 'axios';
import { createCanvas } from 'canvas';

dotenv.config({});





function avatarColor(): string {
  const colors: string[] = [
    '#f44336',
    '#e91e63',
    '#2196f3',
    '#9c27b0',
    '#3f51b5',
    '#00bcd4',
    '#4caf50',
    '#ff9800',
    '#8bc34a',
    '#009688',
    '#03a9f4',
    '#cddc39',
    '#2962ff',
    '#448aff',
    '#84ffff',
    '#00e676',
    '#43a047',
    '#d32f2f',
    '#ff1744',
    '#ad1457',
    '#6a1b9a',
    '#1a237e',
    '#1de9b6',
    '#d84315'
  ];
  return colors[floor(random(0.9) * colors.length)];
}

function generateAvatar(text: string, backgroundColor: string, foregroundColor = 'white') {
  const canvas = createCanvas(200, 200); // length of the canvas
  const context = canvas.getContext('2d'); // dimension of the canvas

  context.fillStyle = backgroundColor; // add background color to the canvas
  context.fillRect(0, 0, canvas.width, canvas.height); //positioning and width and height

  context.font = 'normal 80px sans-serif';
  context.fillStyle = foregroundColor;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/png');
}

// generates the data
async function seedUserData(count: number): Promise<void> {
  let i = 0;
  try {
    for (i = 0; i < count; i++) {
      const username: string = faker.person.firstName();
      console.log('username is ', username);
      const color = avatarColor();
      const avatar = generateAvatar(username.charAt(0).toUpperCase(), color);

      const body = {
        username,
        email: faker.internet.email(),
        password: 'qwerty',
        avatarColor: color,
        avatarImage: avatar
      };


      console.log(`***ADDING USER TO DATABASE*** - ${i + 1} of ${count} - ${username}`);
      await axios.post(`${process.env.API_URL}/signup`, body, {
        headers:{
          'Content-Type': 'application/json',
          'Cookie': 'session=eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlTV1FpT2lJMk5XWXlaVFUyTnpFNE5tRTNNRGMzWkdFM1pEQmxOakFpTENKMVNXUWlPaUl4TkRZMU56UTJPRGsxT0RNaUxDSmxiV0ZwYkNJNkluTmhiWEJzWlRBeVFHMWhhV3d1WTI5dElpd2lkWE5sY201aGJXVWlPaUpUWVcxd2JHVXdNaUlzSW1GMllYUmhja052Ykc5eUlqb2ljbVZrSWl3aWFXRjBJam94TnpFek16TXpOek01ZlEuYmQ0d245Ri1nSkRodXJXTWVIaUgtX0tKUDE1QVFQdnduTW1NYnhjNExEYyJ9; session.sig=hEYBXlOjL2aOGWVbMphl-SnXlNk'
        }
      });
    }
  } catch (error: any) {
    console.log('error is ', error);
    console.log(error?.response?.data);
  }
}

seedUserData(10);
