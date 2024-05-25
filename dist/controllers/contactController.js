"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyContact = void 0;
const typeorm_1 = require("typeorm");
const Contact_1 = require("../entity/Contact");
const identifyContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body;
    const contactRepository = (0, typeorm_1.getRepository)(Contact_1.Contact);
    // Find contacts with matching email or phoneNumber
    const matchingContacts = yield contactRepository.find({
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
        yield contactRepository.save(newContact);
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
    const secondaryContactIds = [];
    for (const contact of matchingContacts) {
        if (contact.id !== primaryContact.id) {
            secondaryContactIds.push(contact.id);
            if (contact.email)
                emails.add(contact.email);
            if (contact.phoneNumber)
                phoneNumbers.add(contact.phoneNumber);
            // Update the secondary contact to link to the primary contact
            contact.linkedId = primaryContact.id;
            contact.linkPrecedence = "secondary";
            yield contactRepository.save(contact);
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
});
exports.identifyContact = identifyContact;
//# sourceMappingURL=contactController.js.map