import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Contact } from '../entity/Contact';

export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  const contactRepository = getRepository(Contact);

  // Find contacts with matching email or phoneNumber
  const matchingContacts = await contactRepository.find({
    where: [
      { email },
      { phoneNumber }
    ]
  });

  if (matchingContacts.length === 0) {
    // Create a new primary contact
    const newContact = contactRepository.create({
      email,
      phoneNumber,
      linkPrecedence: "primary"
    });
    await contactRepository.save(newContact);

    return res.status(200).json({
      contact: {
        primaryContactId: newContact.id,
        emails: [newContact.email],
        phoneNumbers: [newContact.phoneNumber],
        secondaryContactIds: []
      }
    });
  }

  // Sort contacts by createdAt to identify the primary contact
  const primaryContact = matchingContacts.reduce((prev, current) => {
    return (prev.createdAt < current.createdAt) ? prev : current;
  });

  const emails = new Set([primaryContact.email]);
  const phoneNumbers = new Set([primaryContact.phoneNumber]);
  const secondaryContactIds: number[] = [];

  for (const contact of matchingContacts) {
    if (contact.id !== primaryContact.id) {
      secondaryContactIds.push(contact.id);
      if (contact.email) emails.add(contact.email);
      if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);

      // Update the secondary contact to link to the primary contact
      contact.linkedId = primaryContact.id;
      contact.linkPrecedence = "secondary";
      await contactRepository.save(contact);
    }
  }

  return res.status(200).json({
    contact: {
      primaryContactId: primaryContact.id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phoneNumbers),
      secondaryContactIds
    }
  });
};
